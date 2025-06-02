'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/ui/map-view';
import { Donation, DonationStatus } from '@/lib/types';
import { format } from 'date-fns';
import { Package, Clock, MapPin, CalendarDays, User, Phone, Info, Image as ImageIcon, Loader2, MessageCircle } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { StatusBadge } from '@/components/ui/status-badge';
import { findDonationChatRoom, createDonationChatRoom } from '@/lib/chat-service';
import Link from 'next/link';

export default function RecipientDonationDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { donationId } = useParams();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    const fetchDonation = async () => {
      if (!donationId || typeof donationId !== 'string') {
        toast.error('Invalid donation ID.');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'donations', donationId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const donationData = {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
            expiryDate: docSnap.data().expiryDate?.toDate() || new Date(),
            completedAt: docSnap.data().completedAt?.toDate() || null,
            reservedAt: docSnap.data().reservedAt?.toDate() || null,
          } as Donation;
          setDonation(donationData);
        } else {
          toast.error('Donation not found.');
          router.push('/recipient/donations/available'); // Redirect if donation not found
        }
      } catch (err) {
        console.error('Error fetching donation:', err);
        toast.error('Failed to load donation details.');
        router.push('/recipient/donations/available'); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [donationId, router]);

  // Check for existing chat room when donation is loaded
  useEffect(() => {
    const checkForChatRoom = async () => {
      if (!donation || !donation.id) return;

      try {
        const existingChat = await findDonationChatRoom(donation.id);
        if (existingChat) {
          setChatRoomId(existingChat.id);
        }
      } catch (error) {
        console.error('Error checking for chat room:', error);
      }
    };

    checkForChatRoom();
  }, [donation]);

  const handleReserveDonation = async () => {
    if (!user || !donation) return;

    setIsReserving(true);
    try {
      const donationRef = doc(db, 'donations', donation.id);
      await updateDoc(donationRef, {
        status: 'reserved',
        reservedBy: user.uid,
        reservedAt: new Date(),
        updatedAt: new Date(),
      });
      setDonation(prev => prev ? { ...prev, status: DonationStatus.RESERVED, reservedBy: user.uid, reservedAt: new Date() } : null);
      toast.success('Donation reserved successfully!');

      // Create chat room after successful reservation
      try {
        const chatRoom = await createDonationChatRoom(
          donation.id,
          donation.donorId,
          user.uid,
          donation.title
        );
        setChatRoomId(chatRoom.id);
      } catch (chatError) {
        console.error('Error creating chat room:', chatError);
        // Don't show error to user as reservation was successful
      }
    } catch (error) {
      console.error('Error reserving donation:', error);
      toast.error('Failed to reserve donation. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  const handleCompleteDonation = async () => {
    if (!user || !donation || donation.status !== 'reserved' || donation.reservedBy !== user.uid) return;

    setIsCompleting(true);
    try {
      const donationRef = doc(db, 'donations', donation.id);
      await updateDoc(donationRef, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      });
      setDonation(prev => prev ? { ...prev, status: DonationStatus.COMPLETED, completedAt: new Date() } : null);
      toast.success('Donation marked as completed!');
      // Optionally redirect or update UI
    } catch (error) {
      console.error('Error completing donation:', error);
      toast.error('Failed to mark donation as completed. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading donation details...</div>;
  }

  if (!donation) {
    return <div className="flex items-center justify-center h-96 text-destructive">Donation not found or error loading data.</div>;
  }

  const isReservedByCurrentUser = donation.status === 'reserved' && donation.reservedBy === user?.uid;
  const isCompleted = donation.status === 'completed';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold">Donation Details</h2>
        <p className="text-muted-foreground">View the details of this food donation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {donation.title}
            <StatusBadge status={donation.status} />
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Package className="h-4 w-4" /> {donation.category}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {donation.imageUrls && donation.imageUrls.length > 0 && (
            <Carousel className="w-full max-w-xs mx-auto">
              <CarouselContent>
                {donation.imageUrls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <Image
                            src={url}
                            alt={`Donation image ${index + 1}`}
                            width={300}
                            height={300}
                            objectFit="cover"
                            className="rounded-md"
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Info className="h-5 w-5" /> Description</h3>
              <p className="text-muted-foreground">{donation.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2"><Package className="h-5 w-5" /> Quantity</h3>
                <p className="text-muted-foreground">{donation.quantity} {donation.quantityUnit}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Expiry Date</h3>
                <p className="text-muted-foreground">{format(donation.expiryDate, 'PPP')}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="h-5 w-5" /> Pickup Location</h3>
              {donation.pickupAddress?.latitude && donation.pickupAddress?.longitude ? (
                <div className="w-full h-64 mt-2 rounded-md overflow-hidden">
                  <MapView
                    initialCenter={{
                      lat: donation.pickupAddress.latitude,
                      lng: donation.pickupAddress.longitude
                    }}
                    initialZoom={14}
                    showUserLocation={false}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground">Location details not available.</p>
              )}
              {donation.pickupInstructions && (
                 <p className="text-sm text-muted-foreground mt-2">Instructions: {donation.pickupInstructions}</p>
              )}
            </div>

            {/* Display Donor Info (Optional, depending on privacy requirements) */}
            {/* <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5" /> Donor Information</h3>
              <p className="text-muted-foreground">Donor ID: {donation.donorId}</p>
               {/* Add donor name/contact if available and allowed */}
            {/* </div> */}

          </div>

          {!isCompleted && !isReservedByCurrentUser && donation.status === 'active' && (
            <Button onClick={handleReserveDonation} disabled={isReserving} className="w-full">
              {isReserving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isReserving ? 'Reserving...' : 'Reserve Donation'}
            </Button>
          )}

          {isReservedByCurrentUser && (
             <div className="space-y-4">
               <div className="text-center text-green-600 font-semibold">
                  You have reserved this donation.
               </div>

               {/* Chat button */}
               {chatRoomId && (
                 <Button variant="outline" asChild className="w-full">
                   <Link href={`/chat?room=${chatRoomId}`}>
                     <MessageCircle className="h-4 w-4 mr-2" />
                     Chat with Donor
                   </Link>
                 </Button>
               )}

               <Button onClick={handleCompleteDonation} disabled={isReserving} className="w-full">
                 {isReserving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 {isReserving ? 'Marking as Completed...' : 'Mark as Completed'}
               </Button>
             </div>
          )}

           {isCompleted && (
             <div className="text-center text-blue-600 font-semibold">
                This donation has been completed.
             </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
'use client';
 
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Donation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { MapView } from '@/components/ui/map-view';
import { format } from 'date-fns';
import { Package, Calendar, MapPin, Clock, Image as ImageIcon, Pencil, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { findDonationChatRoom } from '@/lib/chat-service';
import { useAuth } from '@/hooks/use-auth';

export default function ViewDonationPage() {
  const { donationId } = useParams();
  const { user } = useAuth();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonation = async () => {
      if (!donationId || typeof donationId !== 'string') {
        setError('Invalid donation ID.');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'donations', donationId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDonation({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
            expiryDate: docSnap.data().expiryDate?.toDate() || new Date(),
            completedAt: docSnap.data().completedAt?.toDate() || null,
            reservedAt: docSnap.data().reservedAt?.toDate() || null,
          } as Donation);
        } else {
          setError('Donation not found.');
        }
      } catch (err) {
        console.error('Error fetching donation:', err);
        setError('Failed to load donation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonation();
  }, [donationId]);

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

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading donation details...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-96 text-destructive">Error: {error}</div>;
  }

  if (!donation) {
    return <div className="flex items-center justify-center h-96">Donation not found.</div>;
  }

  const pickupLocation = donation.pickupAddress?.latitude && donation.pickupAddress?.longitude
    ? { lat: donation.pickupAddress.latitude, lng: donation.pickupAddress.longitude }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold">Donation Details</h2>
          <p className="text-muted-foreground">Information about the selected donation</p>
        </div>
        <div className="flex gap-2">
          {donation.status === 'active' && (
            <Button variant="outline" asChild>
              <Link href={`/donor/donations/edit/${donation.id}`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          {/* Chat button - show if donation is reserved and has a recipient */}
          {donation.status === 'reserved' && donation.reservedBy && chatRoomId && (
            <Button variant="outline" asChild>
              <Link href={`/chat?room=${chatRoomId}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat with Recipient
              </Link>
            </Button>
          )}
          {/* Add Delete/Cancel button here if needed */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{donation.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {donation.category}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Images Carousel */}
            {donation.imageUrls && donation.imageUrls.length > 0 ? (
              <Carousel className="w-full max-w-xs mx-auto">
                <CarouselContent>
                  {donation.imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex aspect-square items-center justify-center p-6">
                            <img src={url} alt={`Donation image ${index + 1}`} className="object-cover w-full h-full rounded-md" />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            ) : (
              <div className="flex items-center justify-center aspect-square rounded-md bg-muted">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground">{donation.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Quantity</h3>
                  <p className="text-muted-foreground">{donation.quantity} {donation.quantityUnit}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Status</h3>
                  <StatusBadge status={donation.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Created</h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(donation.createdAt, 'PPP')}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Expires</h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(donation.expiryDate, 'PPP')}
                  </p>
                </div>
              </div>

              {donation.status === 'reserved' && donation.reservedBy && (
                <div>
                  <h3 className="text-lg font-semibold">Reserved By</h3>
                  <p className="text-muted-foreground">{donation.reservedBy}</p>
                </div>
              )}

              {donation.status === 'completed' && donation.completedAt && (
                <div>
                  <h3 className="text-lg font-semibold">Completed On</h3>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(donation.completedAt, 'PPP')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pickup Location */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Pickup Location</h3>
            <div className="rounded-md overflow-hidden border border-border h-[300px]">
              {pickupLocation ? (
                 <MapView
                    height="100%"
                    initialCenter={pickupLocation}
                    initialZoom={14}
                  />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <MapPin className="h-6 w-6 mr-2" />
                  Location details not available.
                </div>
              )}
            </div>
            {donation.pickupInstructions && (
              <div className="mt-4">
                <h4 className="text-base font-semibold">Pickup Instructions</h4>
                <p className="text-muted-foreground">{donation.pickupInstructions}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
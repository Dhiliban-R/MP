import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

// GET - Fetch all requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    
    // Add filters if provided
    if (userId) {
      q = query(q, where('recipientId', '==', userId));
    }
    
    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST - Create a new request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, quantity, category, recipientId, urgency } = body;

    // Validate required fields
    if (!title || !description || !quantity || !category || !recipientId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const requestData = {
      title,
      description,
      quantity,
      category,
      recipientId,
      urgency: urgency || 'medium',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'requests'), requestData);
    
    return NextResponse.json(
      { id: docRef.id, message: 'Request created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a request
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'requests', id));
    
    return NextResponse.json(
      { message: 'Request deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}

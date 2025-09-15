import { NextRequest, NextResponse } from 'next/server';

// Mock database
let reviews = [
  {
    id: '1',
    title: 'Amazing product!',
    review_text: 'This vitamin C serum has completely transformed my skin. I can see visible results within just 2 weeks of use. Highly recommend!',
    rating: 5,
    is_verified_purchase: true,
    is_approved: true,
    helpful_count: 8,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
    product: {
      id: '1',
      name: 'Vitamin C Serum'
    },
    user: {
      id: 'user1',
      email: 'customer1@example.com'
    }
  },
  {
    id: '2',
    title: 'Good but expensive',
    review_text: 'The product works well but I think its a bit overpriced for the quantity provided. Quality is good though.',
    rating: 3,
    is_verified_purchase: true,
    is_approved: false,
    helpful_count: 2,
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    product: {
      id: '2',
      name: 'Argan Oil Hair Mask'
    },
    user: {
      id: 'user2',
      email: 'customer2@example.com'
    }
  },
  {
    id: '3',
    title: 'Love it!',
    review_text: 'Perfect for my hair type. Leaves my hair soft and manageable. Will definitely repurchase.',
    rating: 4,
    is_verified_purchase: false,
    is_approved: false,
    helpful_count: 0,
    created_at: '2024-01-22T09:15:00Z',
    updated_at: '2024-01-22T09:15:00Z',
    product: {
      id: '2',
      name: 'Argan Oil Hair Mask'
    },
    user: {
      id: 'user3',
      email: 'customer3@example.com'
    }
  }
];

function verifyAdmin(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return auth?.startsWith('Bearer admin_token_') || false;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    const { id } = params;
    const { is_approved } = await request.json();

    const reviewIndex = reviews.findIndex(r => r.id === id);
    if (reviewIndex === -1) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found'
        }
      }, { status: 404 });
    }

    // Update review approval status
    reviews[reviewIndex] = {
      ...reviews[reviewIndex],
      is_approved: is_approved,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        id: reviews[reviewIndex].id,
        is_approved: reviews[reviewIndex].is_approved,
        updated_at: reviews[reviewIndex].updated_at
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL',
        message: 'Internal server error'
      }
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    const { id } = params;
    const reviewIndex = reviews.findIndex(r => r.id === id);

    if (reviewIndex === -1) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found'
        }
      }, { status: 404 });
    }

    reviews.splice(reviewIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL',
        message: 'Internal server error'
      }
    }, { status: 500 });
  }
}
// app/api/dailycheck/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/dailycheck - Create a new daily check entry
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { takenMedication, photoUrl, notes } = await request.json();

  if (typeof takenMedication !== 'boolean') {
    return NextResponse.json({ message: 'Invalid input for takenMedication' }, { status: 400 });
  }

  try {
    // Find the patient associated with the logged-in user
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    const newDailyCheck = await prisma.dailyCheck.create({
      data: {
        patientId: patient.id,
        takenMedication,
        photoUrl,
        notes,
      },
    });
    return NextResponse.json(newDailyCheck, { status: 201 });
  } catch (error) {
    console.error('Error creating daily check:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

// GET /api/dailycheck?patientId=[id] - Get daily check history for a patient
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'MIDWIFE') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ message: 'patientId is required' }, { status: 400 });
  }

  try {
    const dailyChecks = await prisma.dailyCheck.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(dailyChecks, { status: 200 });
  } catch (error) {
    console.error('Error fetching daily checks:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

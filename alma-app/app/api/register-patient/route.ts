// app/api/register-patient/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MIDWIFE') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {
    email,
    password,
    name,
    husbandName,
    age,
    phoneNumber,
    address,
    gestationalAge,
    pregnancyOrder,
    hasMiscarriage,
    miscarriageCount,
    lastMenstrualPeriod,
    estimatedDueDate,
    lastHemoglobin,
  } = await request.json();

  // Basic validation
  if (!email || !password || !name || !phoneNumber || !address || !gestationalAge || !pregnancyOrder || !lastMenstrualPeriod || !estimatedDueDate || !lastHemoglobin) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the midwife who is registering the patient
    const midwife = await prisma.midwife.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!midwife) {
      return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
    }

    // Create new User and Patient in a transaction
    const newUserAndPatient = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'PATIENT',
        },
      });

      const newPatient = await prisma.patient.create({
        data: {
          userId: newUser.id,
          midwifeId: midwife.id,
          name,
          husbandName,
          age: parseInt(age),
          phoneNumber,
          address,
          gestationalAge: parseInt(gestationalAge),
          pregnancyOrder: parseInt(pregnancyOrder),
          hasMiscarriage,
          miscarriageCount: hasMiscarriage ? parseInt(miscarriageCount || '0') : null,
          lastMenstrualPeriod: new Date(lastMenstrualPeriod),
          estimatedDueDate: new Date(estimatedDueDate),
          lastHemoglobin: parseFloat(lastHemoglobin),
        },
      });
      return { newUser, newPatient };
    });

    return NextResponse.json({ message: 'Patient registered successfully', patient: newUserAndPatient.newPatient }, { status: 201 });
  } catch (error) {
    console.error('Error registering patient:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

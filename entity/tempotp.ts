import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class TempOtp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  Telegramusername!: string; // Use this to identify the temporary user (e.g., email or phone number)

  @Column()
  otp!: string; // The OTP sent to the user

  @Column({ type: 'bigint' })
  generatedAt!: number; // Timestamp when the OTP was generated
}

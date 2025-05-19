import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Referral } from '../Referral/Refferal';
import { Role } from './roles';

@Entity()
export class User {
 @PrimaryGeneratedColumn('uuid')
  id!: string ;

  @Column({ unique: true })
  email!: string ; // Provide a default value

  @Column({ unique: true, nullable: true  })
  telegramUsername!: string ; // Provide a default value

  @Column()
  password!: string ; // Provide a default value

  @Column()
  name!: string ; // Provide a default value

  @Column()
  code!: string;

  @Column({nullable: true })
  fcmtoken!: string;

  @Column({ unique: true, nullable: true })
  chatID!: string ; // Provide a default value

  @Column({ type: 'boolean' })
  isSuperUser!: boolean ; // Provide a default value

  @Column()
  jobTitle!: string ; // Provide a default value

  @Column({ type: 'boolean', default: false })
  isVerified?: boolean ; // Provide a default value

  @CreateDateColumn({ type: 'timestamp' })
  createdDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt?: Date; // Timestamp when the project was last updated

  @Column({ nullable: true })
  modifier?: string; // Username, email, or user ID of the person who last modified this project

  @Column()
  creator!: string; // Username, email, or user ID of the person who last modified this project

  @Column({ unique: true, nullable: true })
  phoneNumber?: string; // Add phone number field

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  lastActivity?: Date; // Automatically updated when entity is saved

  @Column({ nullable: true })
  referralCode?: string;

  @Column({ nullable: true })
  referredBy?: string; // ID of referrer

   // Column to store image as binary data
   @Column("longblob", { nullable: true })
   image?: Buffer;

  @OneToMany(() => Referral, (referral) => referral.affiliate)
  referrals?: Referral[];

  @ManyToOne(() => Role, (role) => role.users, { nullable: true, eager: true })
  role: Role | null | undefined;

  async setPassword(password: string) {
    this.password = await bcrypt.hash(password, 10);
  }

  static async checkPassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
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

  @Column({ type: 'boolean', default: false })
  isVerified?: boolean ; // Provide a default value

  @CreateDateColumn({ type: 'timestamp' })
  createdDate?: Date;

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

  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  @JoinTable() // Required for Many-to-Many relations!
  roles?: Role[];

  async setPassword(password: string) {
    this.password = await bcrypt.hash(password, 10);
  }

  static async checkPassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

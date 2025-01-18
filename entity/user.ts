import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

  @Column({ type: 'boolean' })
  isSuperUser!: boolean ; // Provide a default value

  @CreateDateColumn({ type: 'timestamp' })
  createdDate?: Date;

  @Column({ unique: true, nullable: true })
  phoneNumber?: string; // Add phone number field

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  lastActivity?: Date; // Automatically updated when entity is saved

  async setPassword(password: string) {
    this.password = await bcrypt.hash(password, 10);
  }

  static async checkPassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

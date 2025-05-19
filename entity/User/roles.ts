import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './user';
import { Permission } from './permission';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid') // UUID as primary key
  id!: string;

  @Column({ unique: true })
  name!: string; // Example: "admin", "editor", "user"

  @OneToMany(() => User, (user) => user.role)
  users!: Promise<User[]>;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date; // Timestamp when the project was created

  @Column({ type: 'timestamp', nullable: true })
  updatedAt?: Date; // Timestamp when the project was last updated

  @Column({ nullable: true })
  modifier?: string; // Username, email, or user ID of the person who last modified this project

  @Column()
  creator!: string; // Username, email, or user ID of the person who last modified this project

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable()
  permissions!: Permission[];
}

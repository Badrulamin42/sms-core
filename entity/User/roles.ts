import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
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

  @ManyToMany(() => Permission, (permission) => permission.roles, { cascade: true })
  @JoinTable()
  permissions!: Permission[];
}

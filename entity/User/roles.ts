import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from './user';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid') // UUID as primary key
  id!: string;

  @Column({ unique: true })
  name!: string; // Example: "admin", "editor", "user"

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];
}

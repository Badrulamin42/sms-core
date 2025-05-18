// src/entity/permission.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './roles';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string; // e.g. "project:view", "project:add"

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Promise<Role[]>;
}

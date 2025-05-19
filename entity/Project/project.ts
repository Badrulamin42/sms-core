import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Gallery } from '../Gallery/gallery';
import { ProjectUnit } from './projectUnit';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string; // Name of the project

  @Column({ nullable: true })
  description?: string; // Optional project description

  @Column({ nullable: true })
  address?: string; // Optional project description

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date; // Timestamp when the project was created

  @Column({ type: 'timestamp', nullable: true })
  updatedAt?: Date; // Timestamp when the project was last updated

  @Column({ nullable: true })
  modifier?: string; // Username, email, or user ID of the person who last modified this project

  @Column()
  creator!: string; // Username, email, or user ID of the person who last modified this project

  @Column({ default: false })
  isArchived!: boolean; // Flag to archive the project

  @Column()
  status?: string; // Flag to archive the project

  @Column()
  propertyType!: string; // Flag to archive the project

  @OneToMany(() => Gallery, (gallery) => gallery.project)
  galleries!: Gallery[];

  @OneToMany(() => ProjectUnit, (projectUnit) => projectUnit.project)
  projectUnits!: ProjectUnit[];
}
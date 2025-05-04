import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Gallery } from '../Gallery/gallery';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string; // Name of the project

  @Column({ nullable: true })
  description?: string; // Optional project description

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date; // Timestamp when the project was created

  @Column({ type: 'timestamp', nullable: true })
  updatedAt?: Date; // Timestamp when the project was last updated

  @Column({ nullable: true })
  modifier?: string; // Username, email, or user ID of the person who last modified this project

  @Column({ default: false })
  isArchived!: boolean; // Flag to archive the project

  @Column()
  status?: string; // Flag to archive the project

  @OneToMany(() => Gallery, (gallery) => gallery.project)
  galleries!: Gallery[];
}
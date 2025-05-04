import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../Project/project';

@Entity()
export class Gallery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  imageUrl!: string; // Or file path if not using remote URLs

  @Column({ nullable: true })
  caption?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt!: Date;

  @ManyToOne(() => Project, (project) => project.galleries, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'projectId' })
  project?: Project; // Nullable if the gallery is not associated with a project
}

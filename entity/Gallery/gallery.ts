import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from '../Project/project';
import { ProjectUnit } from '../Project/projectUnit';

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

  @ManyToOne(() => ProjectUnit, (projectUnit) => projectUnit.galleries, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'projectUnitId' })
  projectUnit?: ProjectUnit; // Nullable if the gallery is not associated with a project
}

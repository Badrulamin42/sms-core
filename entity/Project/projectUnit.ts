import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project';
import { Gallery } from '../Gallery/gallery';

@Entity()
export class ProjectUnit {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    unitType!: string; // Name of the project

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date; // Timestamp when the project was created

    @Column({ type: 'timestamp', nullable: true })
    updatedAt?: Date; // Timestamp when the project was last updated

    @Column({ nullable: true })
    modifier?: string; // Username, email, or user ID of the person who last modified this project

    @Column()
    creator!: string; // Username, email, or user ID of the person who last modified this project

    @Column()
    squareFeet!: string; //  300 x 200

    @Column()
    totalDimension!: string; // feet / 800

    @Column()
    builtDimentsion!: string; // feet 800

    @Column()
    price!: string; // RM

    @Column()
    tenureType?: string; // freehold / leasehold

    @Column()
    landTitle?: string; // bumi lot,non-bumi,malay reserve, 


    @OneToMany(() => Gallery, (gallery) => gallery.project)
    galleries!: Gallery[];

    @ManyToOne(() => Project, (project) => project.projectUnits, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'projectId' })
    project: any;
}
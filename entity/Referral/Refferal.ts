import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../User/user";

@Entity()
export class Referral {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.referrals)
  affiliate!: User;

  @Column()
  referredUserId!: string;

  @Column({ default: "pending" }) // pending, approved, rejected
  status!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  commission!: number;
}
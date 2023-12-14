import { MembershipRepository } from "@/modules/membership/membership.repository";
import { PrismaModule } from "@/modules/prisma/prisma.module";
import { Module } from "@nestjs/common";

@Module({
  imports: [PrismaModule],
  providers: [MembershipRepository],
  exports: [MembershipRepository],
})
export class MembershipModule {}
import bcrypt from "bcryptjs";
import { CourierVerificationStatus, Role } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";

//* Seed Test Admin
export const seedAdmin = async () => {
	try {
		const isAdminExist = await prisma.user.findFirst({
			where: { role: Role.ADMIN },
		});

		if (isAdminExist) return;

		const name = config.test_admin_name;
		const email = config.test_admin_email;
		const password = await bcrypt.hash(
			config.test_admin_password,
			Number(config.bcrypt_salt_rounds),
		);

		const testAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password,
				role: Role.ADMIN,
				emailVerified: true,
			},
			omit: {
				password: true,
			},
		});

		console.log("Test Admin created, ", testAdmin);
	} catch (error) {
		console.log("Error seeding Admin", error);

		await prisma.user.delete({
			where: { email: config.test_admin_email },
		});
	}
};

//* Seed Test Courier
export const seedCourier = async () => {
	try {
		const isCourierExist = await prisma.user.findFirst({
			where: { role: Role.COURIER },
		});

		if (isCourierExist) return;

		const name = config.test_courier_name;
		const email = config.test_courier_email as string;
		const password = await bcrypt.hash(
			config.test_courier_password as string,
			Number(config.bcrypt_salt_rounds),
		);

		const testCourier = await prisma.user.create({
			data: {
				name,
				email,
				password,
				role: Role.COURIER,
				emailVerified: true,
				courier: {
					create: {
						verificationStatus: CourierVerificationStatus.APPROVED,
					},
				},
			},
			omit: {
				password: true,
			},
		});

		console.log("Test Courier created, ", testCourier);
	} catch (error) {
		console.log("Error seeding courier", error);

		await prisma.user.delete({
			where: { email: config.test_courier_email },
		});
	}
};

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
	try {
		const client = await clientPromise;
		const db = client.db(process.env.MONGODB_DATABASE);

		const body = await req.json();

		const result = await db
			.collection("users")
			.find({ email: body.email })
			.toArray();
		if (result.length == 0)
			return new NextResponse(JSON.stringify({ msg: "There's no account." }), {
				status: 200,
			});

		const token = jwt.sign({ email: body.email }, process.env.JWT_SECRET!, {
			expiresIn: 15 * 60,
		});

		const transporter = nodemailer.createTransport({
			pool: true,
			host: "smtp.gmail.com",
			port: 465,
			secure: true, // use TLS
			auth: {
				user: process.env.EMAIL_SENDER,
				pass: process.env.EMAIL_SENDER_APP_PASSWORD,
			},
		});

		const mailOptions = {
			from: process.env.EMAIL_SENDER,
			to: body.email,
			subject: "Your Login Verification",
			text: `Copy this token to continue verification: ${token}`,
		};

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				return new NextResponse(error.message, { status: 400 });
			} else {
				return new NextResponse("Email Sent", { status: 200 });
			}
		});

		return new NextResponse(JSON.stringify({ msg: "" }), { status: 200 });
	} catch (e) {
		console.log(e);
		return new NextResponse(e as any, { status: 500 });
	}
}
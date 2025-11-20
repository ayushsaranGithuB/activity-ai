// Health Check Route Handler

import { FastifyRequest, FastifyReply } from "fastify";

export function health(request: FastifyRequest, reply: FastifyReply): void {
    reply.send({ status: "ok", timestamp: Date.now() });
}
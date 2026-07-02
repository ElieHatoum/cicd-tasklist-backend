import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("POST /api/tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});

		it("should create a task without description", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "No Desc" });

			expect(res.status).toBe(201);
			expect(res.body.title).toBe("No Desc");
			expect(res.body.description).toBeNull();
		});

		it("should return 400 when title is missing", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({});

			expect(res.status).toBe(400);
			expect(res.body.error).toContain("Title is required");
		});

		it("should return 400 when title is empty", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "   " });

			expect(res.status).toBe(400);
		});
	});

	describe("GET /api/tasks", () => {
		it("should return an empty array when no tasks exist", async () => {
			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);
			expect(res.body).toEqual([]);
		});

		it("should return all tasks", async () => {
			await testPrisma.task.create({ data: { title: "Task 1" } });
			await testPrisma.task.create({ data: { title: "Task 2" } });

			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);
		});
	});

	describe("GET /api/tasks/:id", () => {
		it("should return a task by id", async () => {
			const task = await testPrisma.task.create({ data: { title: "Find Me" } });

			const res = await request(app).get(`/api/tasks/${task.id}`);

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("Find Me");
		});

		it("should return 404 when task does not exist", async () => {
			const res = await request(app).get("/api/tasks/99999");

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Task not found");
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app).get("/api/tasks/abc");

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid task ID");
		});
	});

	describe("PUT /api/tasks/:id", () => {
		it("should update a task", async () => {
			const task = await testPrisma.task.create({ data: { title: "Old Title" } });

			const res = await request(app)
				.put(`/api/tasks/${task.id}`)
				.send({ title: "New Title", completed: true });

			expect(res.status).toBe(200);
			expect(res.body.title).toBe("New Title");
			expect(res.body.completed).toBe(true);
		});

		it("should return 404 when task does not exist", async () => {
			const res = await request(app)
				.put("/api/tasks/99999")
				.send({ title: "X" });

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Task not found");
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app)
				.put("/api/tasks/abc")
				.send({ title: "X" });

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid task ID");
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete a task", async () => {
			const task = await testPrisma.task.create({ data: { title: "Delete Me" } });

			const res = await request(app).delete(`/api/tasks/${task.id}`);

			expect(res.status).toBe(204);

			const deleted = await testPrisma.task.findUnique({ where: { id: task.id } });
			expect(deleted).toBeNull();
		});

		it("should return 404 when task does not exist", async () => {
			const res = await request(app).delete("/api/tasks/99999");

			expect(res.status).toBe(404);
			expect(res.body.error).toBe("Task not found");
		});

		it("should return 400 for invalid id", async () => {
			const res = await request(app).delete("/api/tasks/abc");

			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid task ID");
		});
	});
});

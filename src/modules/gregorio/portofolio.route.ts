import { FastifyInstance } from "fastify";
import * as c from "./portofolio.controller";



export default async function portfolioRoutes(app: FastifyInstance) {

app.get("/", c.getProject);
app.get("/files/:name", c.showFile);

    

}
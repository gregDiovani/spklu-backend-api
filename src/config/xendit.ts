import axios from "axios";
import { env } from "./env";


const auth = Buffer.from(`${env.XENDIT_API_KEY}:`).toString('base64');

const xendit = axios.create({
    baseURL: "https://api.xendit.co/",

    headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`

    }
});

export default xendit;

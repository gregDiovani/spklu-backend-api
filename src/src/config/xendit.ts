import axios from "axios";
import { env } from "./env";


const xendit_apiKEY = env.XENDIT_API_KEY;

const xendit = axios.create({
    baseURL: "https://api.xendit.co/",

    headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${xendit_apiKEY}`

    }
});

export default xendit;

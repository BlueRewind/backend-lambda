import { handler } from "./index";

// used for local testing initially
const main = async () => {
    const res = await handler({password: "hello"} as any);
    console.log(res);
}

main();
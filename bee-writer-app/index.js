import fs from "fs";
import Hyperbee from "hyperbee";
import Hyperswarm from "hyperswarm";
import Corestore from "corestore";
import b4a from "b4a";

const store = new Corestore("./data");
const swarm = new Hyperswarm();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown(){
    console.log('shutting down...');
    try {
        await swarm.destroy();
        await store.close();
        console.log('Shutdown complete.');
        process.exit(1);
    } catch (error) {
        console.error(`Error during shutdown: ${error}`);
        process.exit(0);
    }
}

swarm.on('connection', conn => store.replicate(conn));
const core = store.get({ name: "my-bee-core" });

const bee = new Hyperbee(core, {
    keyEncoding: "utf-8",
    valueEncoding: "utf-8",
});

await core.ready();
const discovery = swarm.join(core.discoveryKey);

discovery.flushed().then(() => {
    console.log('bee key: ', b4a.toString(core.key, 'hex'));
});

if(core.length === 0){
    console.log('importing dictionary...');
    const dict = JSON.parse(fs.readFileSync('./dict.json'));
    const batch = bee.batch();
    for(const { key, value } of dict){
       await batch.put(key, value); 
    }
    await batch.flush();
}else{
    console.log('seeding dictionary...');
}
import { getCell } from "../../CoreLogic/H3.js";
import { add, addToSet, Delete, get, getSet } from "../../CoreLogic/inMemory.service.js";
import { PriorityQueue } from "@datastructures-js/priority-queue";
async function ML(avg, hist, info = {}) {
    return .5 * avg + .5 * hist;
}

export async function HarvesineDistance(u, v) {
    return Math.sqrt(Math.pow(u.lat - v.lat, 2) + Math.pow(u.lng - v.lng, 2));
}

async function getPredictedSpeed(id) {
    const info = await get(`edge:${id}`);
    const avgSpeed = info.avgRealTimeSpeed;
    const historic_speed = info.avgHistoricSpeed;
    let avg = avgSpeed ? avgSpeed.avg : process.env.DEFAULT_SPEED;
    let hist = historic_speed ? historic_speed.avg : process.env.DEFAULT_SPEED;
    let predicted = avg * .333 + hist * .333 + (1 - .666) * await ML(avg, hist, info.ML_info);
    return predicted;
}

export async function getWeight(id) {
    const edge = await get(`edge:${id}`);
    if (edge.weight) return edge.weight;
    const dist = edge.dist || HarvesineDistance(data.u, data.v);
    let w = dist / await getPredictedSpeed(id);
    return w;
}

export async function dijkstra(src, G,  isRev = 0) {
    let pq = new PriorityQueue((a, b) => a.path_w - b.path_w);
    pq.enqueue({ u: src, path_w: 0 });
    const srcKey = `${src.lat},${src.lng}`;
    let path = new Map();
    path.set(srcKey, { node: src, w: 0 });
    while (!pq.isEmpty()) {
        let { u, path_w } = pq.dequeue();
        const uKey = `${u.lat},${u.lng}`;
        for (let neighbor of (G.get(uKey) || [])) {
            let v = neighbor.node;
            const vKey = `${v.lat},${v.lng}`;
            let id = neighbor.id;
            let w = await getWeight(id);
            let path_v = path.has(vKey) ? path.get(vKey).w : Infinity;
            let path_u = path.get(uKey).w;
            if (path_v > path_u + w) {
                path.set(vKey, { node: v, w: path_u + w });
                pq.enqueue({ u: v, path_w: path_u + w });
            }
        }
    }

    const index =  getCell(src.lat , src.lng) ; 
    await Promise.all(
        Array.from(path.values()).map(async (path_data) => {
            let v = path_data.node;
            let val = path_data.w;
            if (v.lat === src.lat && v.lng === src.lng) return;

            let u = src;
            if (isRev) [u, v] = [v, u];

            const cross_id = `cross_${u.lat}_${u.lng}_${v.lat}_${v.lng}`;
            let data = await get(`edge:${cross_id}`);
            if (!data) {
                data = { id: cross_id, u, v, weight: val };
            }
            addToSet(`starEdges:${index}+${v}`   ,  id) ; 
            return add(`edge:${cross_id}`, JSON.stringify(data));
        })
    );
    return path;
}

export async function minPath(u, v, G) {
    const dist = await dijkstra(u, G);
    const vKey = `${v.lat},${v.lng}`;
    return dist.has(vKey) ? dist.get(vKey).w : null;
}
export async function preCompute(index) {
    const edges = await getSet(`${index}`, 'edges_7');

    let G = new Map();
    let rev_G = new Map();
    const mapped_edges = await Promise.all(edges.map(id => get(`edge:${id}`)));
    for (let edge of mapped_edges) {
        if (!edge) continue;
        const { id, u, v, dist } = edge;

        const uKey = `${u.lat},${u.lng}`;
        const vKey = `${v.lat},${v.lng}`;

        if (!G.has(uKey)) G.set(uKey, []);
        G.get(uKey).push({ node: v, id, dist });

        if (!rev_G.has(vKey)) rev_G.set(vKey, []);
        rev_G.get(vKey).push({ node: u, id, dist });
    }

    let src = await getSet(`borderNodes:${index}`);
    for (let nd_str of src) {
        if (nd_str === "[object Object]") continue;
        let nd = JSON.parse(nd_str);
        dijkstra(nd, G);
        dijkstra(nd, rev_G,1);
    }
}




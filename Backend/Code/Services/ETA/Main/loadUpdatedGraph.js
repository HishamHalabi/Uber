////the cairopolygon ,  isPointInpoly  from chatGpt

import fs from "fs";
import through from "through2";
import parseOSM from "osm-pbf-parser";
import { getCell } from "../../CoreLogic/H3.js";
import { add, addToSet, Delete } from "../../CoreLogic/inMemory.service.js";
import { preCompute, HarvesineDistance } from "./algo.js";
import { InMemoryConnect } from "../../../Config/redis.connection.js";
import { connectMongo } from "../../../Config/mongo.connection.js";


const cairoPolygon = [
    [30.103, 31.256],
    [30.103, 31.019],
    [29.810, 31.019],
    [29.810, 31.256],
];

function isPointInPolygon(lat, lon, polygon) {
    let x = lon, y = lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][1], yi = polygon[i][0];
        let xj = polygon[j][1], yj = polygon[j][0];

        let intersect =
            (yi > y) !== (yj > y) &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}

export function isInCairo(node) {
    return isPointInPolygon(node.lat, node.lon, cairoPolygon);
}

const nodes = new Map();
const hexas = new Set();
const edges = new Set();

export async function add_edge(u, v, id  , isStarEdge = 0 ) {
    if (edges.has(id)) return;
    edges.add(id);

    const cell7_u = getCell(u.lat, u.lng, 7);
    const cell7_v = getCell(v.lat, v.lng, 7);

    hexas.add(cell7_u);
    hexas.add(cell7_v);
    
    await addToSet(`${cell7_u}`, id, "edge_7");
    if (cell7_u !== cell7_v) {
        await addToSet(`${cell7_v}`, id, "edge_7");
        await add(`borderEdges:${cell7_u}`, id);
        await add(`borderNodes:${cell7_u}`, u);
    }
    await add(`edge:${id}`, JSON.stringify({ u, v }));
}


export async function reload(index) {
    const edges = await getSet(index, "edge_7");
    await Delete(`borderEdges:${index}`);
    await Delete(`borderNodes:${index}`);
    await Delete(`starEdges:${index}`);
    await Delete(`cnt_updates:${index}`);
    
    for (const edge of edges) {
        const { u, v } = await get(`edge:${edge}`);
        await add_edge(u, v, edge);
    }
    await preCompute(index);
}


function Pre() {
    return new Promise((resolve, reject) => {
        const osm = parseOSM();

        fs.createReadStream("../Dataset/egypt-260410.osm.pbf")
            .pipe(osm)
            .pipe(
                through.obj(function (items, enc, next) {

                    (async () => {
                        for (const item of items) {


                            if (item.type === "node") {
                                if (isInCairo(item)) {
                                    nodes.set(item.id, {
                                        lat: item.lat,
                                        lng: item.lon
                                    });
                                }
                            }


                            if (item.type === "way" && item.tags.highway) {
                                for (let i = 0; i < item.refs.length - 1; i++) {
                                    const u = nodes.get(item.refs[i]);
                                    const v = nodes.get(item.refs[i + 1]);

                                    if (!u || !v) continue;

                                    await add_edge(u, v, `${item.id}_${i}`);
                                }
                            }
                        }
                    })()
                        .then(() => next())
                        .catch(err => next(err));
                })
            )
            .on("finish", resolve)
            .on("error", reject);
    });
}

async function main() {
    console.log("Connecting...");
    await InMemoryConnect();
    await connectMongo();

    console.log("Processing...");
    await Pre();


    console.log("Precomputing...");
    for (const h of hexas) {
        await preCompute(h);
    }

    console.log("loading Graph is Done ");
}

main().catch(console.error);

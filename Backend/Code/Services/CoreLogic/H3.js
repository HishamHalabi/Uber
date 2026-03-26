import h3 from "h3-js"
const mxK = 5;
import { get, getSet, isAvalaible, sizeOFSet } from "./inMemory.service.js";

export function getCell(lat, lng, res) {
    return h3.latLngToCell(lat, lng, res);
}

export function getCellCenter(index) {
    return h3.cellToLatLng(index);
}


//i didnt't use builtIn gridDisk  of some fixed k to avoid going farther with no need
export async function kRing(index, limit = 20) {
    let vis = new Set();
    vis.add(index);

    let cells = [], candidates = [];
    cells.push(index);
    for (let i = 0; i < mxK; ++i) {
        let cnt = cells.length;

        let groups = await Promise.all(cells.map(ch => getSet(ch)));
        const set_groups = [];
        for (let g of groups) {
            if (vis.has(g)) continue;
            vis.add(g);
            set_groups.push(g);
        }

        groups = set_groups;

        const drivers = [];
        for (let g of set_groups) {
            for (let d of g) {
                drivers.push(d);
            }
        }
        const filtered = await Promise.all(drivers.map(d => isAvalaible(d) ? d : null));
        for (let d of filtered) {
            if (d) candidates.push(d);
            if (candidates.length >= limit) return candidates;
        }
    }
    return candidates;
}


export async function findCandidates(lat, lng, limit = 20) {
    const candidates = await kRing(getCell(lat, lng, 9), limit);
    return candidates;
}
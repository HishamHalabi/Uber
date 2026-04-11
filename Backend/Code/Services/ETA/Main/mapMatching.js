
//Mostly we dont need to expand to neigbours as edge im in will be inside same hexa im in  

import { HarvesineDistance } from "./algo.js";
import { getCell, getNeigbours } from "../../CoreLogic/H3.js";
import { getSet } from "../../CoreLogic/inMemory.service.js";

//for egde btw 2 hexas we add it to both so that's ok
export async function kRingGraphMatching(node) {
    const index = getCell(node.lat, node.lng, 9);
    let vis = new Set();
    vis.add(index);

    let cells = [index];
    for (let i = 0; i < 2; ++i) {
        let cnt = cells.length;

        let groups = await Promise.all(cells.map(ch => getSet(ch, 'edge_9')));
        const set_groups = [];
        for (let g of groups) {
            if (vis.has(g)) continue;
            vis.add(g);
            set_groups.push(g);
        }

        groups = set_groups;

        const edge_ids = [];
        for (let g of set_groups) {
            for (let edge_id of g) {
                edge_ids.push(edge_id);
            }
        }

        let mn = [1e9, null];
        const mapped_edges = await Promise.all(edge_ids.map(id => get(`edge:${id}`)));
        for (let edge of mapped_edges) {
            if (!edge) continue;
            let u = edge.u, v = edge.v;
            if (HarvesineDistance(u, node) + HarvesineDistance(v, node) < mn[0]) {
                mn[0] = HarvesineDistance(u, node) + HarvesineDistance(v, node);
                mn[1] = edge;
            }
        }
        if (mn[1]) {
            return mn[1];
        }

        for (let i = 0; i < cnt; ++i) {
            const neigbours = getNeigbours(cells[i]);
            for (let n of neigbours) {
                if (vis.has(n)) continue;
                vis.add(n);
                cells.push(n);
            }
        }
    }
}

export async function MatchEdge(node) {
    return await kRingGraphMatching(node)
}

export async function MatchNode(node) {
    const edge = await kRingGraphMatching(node);
    const u = edge.u, v = edge.v;
    const distU = HarvesineDistance(u, node);
    const distV = HarvesineDistance(v, node);
    if (distU < distV) return u;
    return v;
}
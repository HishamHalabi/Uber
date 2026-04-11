import { getCell, getNeigbours } from "../../CoreLogic/H3.js";
import { add, Delete, deleteFromSet, get, getSet, sizeOFSet } from "../../CoreLogic/inMemory.service.js";
import { MatchEdge, MatchNode } from "./mapMatching.js";
import { minPath, preCompute } from "./algo.js";
import { add_edge } from "./loadUpdatedGraph.js";

/*
  we use 7 resolution hexa basicly , 9  is only for fast edge , node matching 
  -------------------------------
   cnt_updates:h3Index >> number of updates in this hexa
   edge_7 or_9 :h3Index >> edges in this hex
   borderEdges:h3Index >> border edges of this hexa
   edge:id >> {weight  , cntReal , cntAvg , avgRealTimeSpeed , avgHistoricSpeed , ML_info , cell_7 ,cell_9 , type:"normal|cross"}
*/


export async function updateTraffic(u, update_info) {
    let edge = await MatchEdge(u);
    if (!edge) {
        return;
    }
    let info = await get(`edge:${edge.id}`);
    if (!info || !update_info || !update_info.action) {
        return;
    }

    if (update_info.action == "add") {
        add_edge(edge.u, edge.v, edge.id, edge.dist);
        return;
    }

    if (update_info.action == "deleted") {
        deleteFromSet(info.cell_7, edge.id, "edge_7");
        deleteFromSet(info.cell_9, edge.id, "edge_9");
        deleteFromSet(info.cell_7, edge.id, "borderEdges");
        Delete(`edge:${edge.id}`);
        preCompute(info.cell_7);
        preCompute(info.cell_9);
        return;
    }


    if (update_info.speed) {
        let { cntReal, cntAvg, avgRealTimeSpeed, avgHistoricSpeed, ML_info, cell_7, cell_9 } = info;
        cntAvg = Math.min(cntAvg, 1000);
        cntReal = Math.min(cntReal, 1000000000);
        add(`edge:${edge.id}`, JSON.stringify({
            dist: edge.dist,
            cntReal: cntReal + 1, cntAvg: cntAvg + 1,
            avgRealTimeSpeed: (avgRealTimeSpeed * cntReal + update_info.speed) / (cntReal + 1),
            avgHistoricSpeed: (avgHistoricSpeed * cntAvg + update_info.speed) / (cntAvg + 1),
            ML_info: ML_info,
            cell_7: cell_7,
            cell_9: cell_9
        }));
    }
    if (update_info.factors) {
        //updating ML
    }

    let cnt = await get(`updates:${info.cell_7}`);
    if (!cnt) {
        cnt = 0;
    }
    cnt = Number(cnt);
    if (cnt == await sizeOFSet(info.cell_7, 'edge_7')) {
        cnt = 0;
        preCompute(info.cell_7);
    }
    await add(`updates:${info.cell_7}`, cnt + 1);
}


export async function getETA(u, v) {
    u = await MatchNode(u);
    v = await MatchNode(v);

    let G = new Map();
    let u_index = getCell(u.lat, u.lng, 7);
    let v_index = getCell(v.lat, v.lng, 7);
    const borderEdges_u = await getSet(`borderEdges:${u_index}`);
    const borderEdges_v = await getSet(`borderEdges:${v_index}`);


    const uMatchKey = `${u.lat},${u.lng}`;
    const vMatchKey = `${v.lat},${v.lng}`;

    const b_u_edges = await Promise.all(borderEdges_u.map(id => get(`edge:${id}`)));
    for (let edge of b_u_edges) {
        if (!edge) continue;
        if (!G.has(uMatchKey)) G.set(uMatchKey, []);
        G.get(uMatchKey).push({ node: edge.v, id: edge.id, dist: edge.dist });
    }

    const b_v_edges = await Promise.all(borderEdges_v.map(id => get(`edge:${id}`)));
    for (let edge of b_v_edges) {
        if (!edge) continue;
        if (!G.has(vMatchKey)) G.set(vMatchKey, []);
        G.get(vMatchKey).push({ node: edge.u, id: edge.id, dist: edge.dist });
    }

    let vis = new Set();
    vis.add(u_index);


    let cells = [u_index];
    for (let i = 0; i < 2; ++i) {
        let cnt = cells.length;

        let fnd = 0;
        for (let j = 0; j < cnt; ++j) fnd = fnd || (cells[j] == v_index);


        let groups = await Promise.all(cells.map(ch => getSet(ch, "borderEdges")));
        const set_groups = [];
        for (let g of groups) {
            if (vis.has(g)) continue;
            vis.add(g);
            set_groups.push(g);
        }
        groups = set_groups;

        let all_ids = [];
        for (let g of set_groups) {
            for (let edge_id of g) {
                all_ids.push(edge_id);
            }
        }
        const mapped_edges = await Promise.all(all_ids.map(id => get(`edge:${id}`)));

        for (let edge of mapped_edges) {
            if (!edge) continue;
            const { id, u: edge_u, v: edge_v, dist } = edge;
            const loop_uKey = `${edge_u.lat},${edge_u.lng}`;
            if (!G.has(loop_uKey)) G.set(loop_uKey, []);
            G.get(loop_uKey).push({ node: edge_v, id, dist });
        }

        for (let J = 0; J < cnt; ++J) {
            const neigbours = getNeigbours(cells[J]);
            for (let n of neigbours) {
                if (vis.has(n)) continue;
                vis.add(n);
                cells.push(n);
            }
        }


        if (fnd) {
            const w = await minPath(u, v, G);
            if (w) {
                return w;
            }
        }
    }
    return null;
}
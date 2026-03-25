import h3 from "h3-js"
const  mxK = 5;
import { get, getSet, isAvalaible, sizeOFSet } from "./inMemory.service";

export function getCell(lat,  lng ,res)  { 
    return  h3.latLngToCell(lat ,lng , res);  
}

export function getCellCenter(index)  { 
    return h3.cellToLatLng(index) ;  
}


//i didnt't use builtIn gridDisk  of some fixed k to avoid going farther with no need
export async  function kRing(index, limit = 20)  {  
      let vis = new Set()  ; 
      vis.add(index);  

      let  cells = []  , candidates  = [];
      cells.push(index) ; 
      for (let  i =  0 ; i  <  mxK  ;  ++i)  { 
                let cnt =  cells.length; 
                for (let  j = 0 ;  j  < cnt;  ++j)  { 
                          let childs = h3.gridRing(cells[j],1)  ;
                          for (let ch of childs)  { 
                                   if (!vis.has(ch))  {
                                        vis.add(ch)  ; 
                                        cells.push(ch) ;  
                                       
                                        const filter=   await Promise.all(cells.map(ch =>isAvalaible(ch)));
                                        const drivers   = await Promise.all(filter.map(ch => getSet(ch)));
                                        
                                        for (let driver of  drivers )  { 
                                                if (candidates.length >=limit)  
                                                                   break ; 
                                        }
                                        if (candidates.length >=limit)  
                                                                   break ; 
                                       
                                   }
                                 
                          }
                }   
                if  (candidates.length  >= limit) break ;   
      }


      if (candidates.length  <  limit)return [] ; 
      return candidates ; 
}


export async function findCandidates(lat , lng , limit = 20)  { 
    const candidates =  kRing(getCell(lat , lng ,  9)  , limit);
}
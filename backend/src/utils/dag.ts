type IdType = string;

export class DAG {
    private nodes: {
        [id in IdType]: {
            name: IdType;
            outgoing: Set<IdType>;
        };
    } = {};

    public constructor(nodes: IdType[] = []) {
        for (const node of nodes) {
            this.addNode(node);
        }
    }

    public getNodes() {
        return this.nodes;
    }

    public addNode(id: IdType, failSilently = false) {
        if (id in this.nodes && !failSilently) {
            throw new Error(`Node with ID ${id} already exists in graph`);
        } else {
            this.nodes[id] = {
                name: id,
                outgoing: new Set(),
            };
        }
    }

    public addEdge(start: IdType, end: IdType) {
        if (!(start in this.nodes) || !(end in this.nodes)) {
            throw new Error(
                `Cannot construct edge between ${start} and ${end} because not all nodes are defined`
            );
        }
        if (start === end) {
            throw new Error(`Cannot build edge to start`);
        }
        // INFO: Since we are using a set here, double insert has no effect
        this.nodes[start]!.outgoing.add(end);
    }

    public topsort(currentNode: IdType | undefined, result: IdType[] = []) {
        if (currentNode === undefined) {
            let activeNode: IdType;
            for (;;) {
                const availableNodesToPick = Object.keys(this.nodes).filter(
                    (f) =>
                        !result.includes(f) &&
                        !Object.values(this.nodes).some((e) =>
                            e.outgoing.has(f)
                        )
                );
                if (availableNodesToPick.length === 0) {
                    break;
                }

                activeNode = availableNodesToPick.at(0)!;
                this.topsort(activeNode, result);
            }

            if (result.length !== Object.keys(this.nodes).length) {
                throw new Error('The algorithm has failed us / is incorrect');
            }

            return result;
        }
        if (result.includes(currentNode)) {
            return result;
        }
        const children = this.nodes[currentNode]?.outgoing ?? new Set<IdType>();

        for (const child of children) {
            this.topsort(child, result);
        }

        result.push(currentNode);
        return result;
    }
}

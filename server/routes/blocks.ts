import type { MicroBlock } from "nimiq-rpc-client-ts/types";
import { initRpcClient } from "nimiq-rpc-client-ts/client";
import { BlockType } from "nimiq-rpc-client-ts/types";
import { subscribeForHeadBlock } from "nimiq-rpc-client-ts/ws";

interface StreamedBlock {
    number: number;
    validator?: string;
}

export default defineWebSocketHandler({
    async open(peer) {
        peer.send(JSON.stringify({ type: "connected" }));

        const config = useRuntimeConfig();
        const nodeRpcUrl = config.nimiqRpcUrl;

        try {
            initRpcClient({ url: nodeRpcUrl });

            const eventEmitter = await subscribeForHeadBlock(true);

            eventEmitter.addEventListener(
                "data",
                async (event: CustomEvent) => {
                    const { data: block } = event.detail;
                    if (!block) return;

                    const streamedBlock: StreamedBlock = {
                        number: block.number,
                        validator:
                            block.type === BlockType.Micro
                                ? (block as MicroBlock).producer.validator
                                : undefined,
                    };

                    peer.send(
                        JSON.stringify({ type: "block", data: streamedBlock }),
                    );
                },
            );

            eventEmitter.addEventListener("error", (event: CustomEvent) => {
                peer.send(
                    JSON.stringify({
                        type: "error",
                        message: "Subscription error",
                    }),
                );
            });
        } catch {
            peer.send(
                JSON.stringify({
                    type: "error",
                    message: "Failed to subscribe",
                }),
            );
        }
    },

    async close() {},
    async error(peer, error) {
        console.error("WS error:", error);
    },
});

// import dotenv from "dotenv";
// import { StreamingTextResponse, LangChainStream } from "ai";
// import { auth, currentUser } from "@clerk/nextjs";
// import { Replicate } from "langchain/llms/replicate";
// import { CallbackManager } from "langchain/callbacks";
// import { NextResponse } from "next/server";

// import { MemoryManager } from "@/lib/memory";
// import { rateLimit } from "@/lib/rate-limit";
// import prismadb from "@/lib/prismadb";

// dotenv.config({ path: `.env` });

// export async function POST(
//   request: Request,
//   { params }: { params: { chatId: string } }
// ) {
//   try {
//     const { prompt } = await request.json();
//     const user = await currentUser();

//     if (!user || !user.firstName || !user.id) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const identifier = request.url + "-" + user.id;
//     const { success } = await rateLimit(identifier);

//     if (!success) {
//       return new NextResponse("Rate limit exceeded", { status: 429 });
//     }

//     const companion = await prismadb.companion.update({
//       where: {
//         id: params.chatId,
//       },
//       data: {
//         messages: {
//           create: {
//             content: prompt,
//             role: "user",
//             userId: user.id,
//           },
//         },
//       },
//     });

//     if (!companion) {
//       return new NextResponse("Companion not found", { status: 404 });
//     }

//     const name = companion.id;
//     const companion_file_name = name + ".txt";

//     const companionKey = {
//       companionName: name,
//       userId: user.id,
//       modelName: "llama2-13b",
//     };
//     const memoryManager = await MemoryManager.getInstance();

//     const records = await memoryManager.readLatestHistory(companionKey);

//     if (records.length === 0) {
//       await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
//     }

//     await memoryManager.writeToHistory("User: " + prompt + "\n", companionKey);

//     // Query Pinecone

//     const recentChatHistory = await memoryManager.readLatestHistory(companionKey);

//     // Right now the preamble is included in the similarity search, but that
//     // shouldn't be an issue

//     const similarDocs = await memoryManager.vectorSearch(
//       recentChatHistory,
//       companion_file_name
//     );

//     let relevantHistory = "";
//     if (!!similarDocs && similarDocs.length !== 0) {
//       relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
//     }

//     const { handlers } = LangChainStream();
//     // Call Replicate for inference
//     const model = new Replicate({
//       model:
//         "aitechtree/nsfw-novel-generation:d1b68d1b966f96f97a2364cec456e84fda2d24d50eeb14abe14b509f2223ed97",
//       // "a16z-infra/llama-2-13b-chat:df7690f1994d94e96ad9d568eac121aecf50684a0b0963b25a41cc40061269e5",
//         // "nwhitehead/llama2-7b-chat-gptq:8c1f632f7a9df740bfbe8f6b35e491ddfe5c43a79b43f062f719ccbe03772b52",
//       input: {
//         max_length: 2048,
//       },
//       apiKey: process.env.REPLICATE_API_TOKEN,
//       callbackManager: CallbackManager.fromHandlers(handlers),
//     });

//     // Turn verbose on for debugging
//     model.verbose = true;

//     const resp = String(
//       await model
//         .call(
//           `
//         ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${name}: prefix. 

//         ${companion.instructions}

//         Below are relevant details about ${name}'s past and the conversation you are in.
//         ${relevantHistory}

//         ${recentChatHistory}\n${name}:`
//         )
//         .catch(console.error)
//     );

//     const cleaned = resp.replaceAll(",", "");
//     const chunks = cleaned.split("\n");
//     const response = chunks[0];

//     await memoryManager.writeToHistory("" + response.trim(), companionKey);
//     var Readable = require("stream").Readable;

//     let s = new Readable();
//     s.push(response);
//     s.push(null);

//     if (response !== undefined && response.length > 1) {
//       memoryManager.writeToHistory("" + response.trim(), companionKey);

//       await prismadb.companion.update({
//         where: {
//           id: params.chatId,
//         },
//         data: {
//           messages: {
//             create: {
//               content: response.trim(),
//               role: "system",
//               userId: user.id,
//             },
//           },
//         },
//       });
//     }

//     return new StreamingTextResponse(s);
//   } catch (error) {
//     console.log('[CHAT_POST]', error)
//     return new NextResponse("Internal Error", { status: 500 });
//   }
// }







import dotenv from "dotenv";
import { StreamingTextResponse, LangChainStream } from "ai";
import { currentUser } from "@clerk/nextjs";
import { Configuration, OpenAIApi, CreateChatCompletionResponse } from "openai";
import { CallbackManager } from "langchain/callbacks";
import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

dotenv.config({ path: `.env` });

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    // if (!user || !user.firstName || !user.id) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    const identifier = request.url + "-" + user?.id;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    const companion = await prismadb.companion.update({
      where: {
        id: params.chatId,
      },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            // @ts-ignore
            userId: user.id,
          },
        },
      },
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }

    const name = companion.id;
    const companion_file_name = name + ".txt";

    const companionKey = {
      companionName: name!,
      userId: user?.id!,
      modelName: "gpt-3.5-turbo",
    };
    const memoryManager = await MemoryManager.getInstance();

    const records = await memoryManager.readLatestHistory(companionKey);
    if (records.length === 0) {
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
    }
    await memoryManager.writeToHistory("User: " + prompt + "\n", companionKey);

    // Query Pinecone

    const recentChatHistory = await memoryManager.readLatestHistory(
      companionKey
    );

    // Right now the preamble is included in the similarity search, but that
    // shouldn't be an issue

    const similarDocs = await memoryManager.vectorSearch(
      recentChatHistory,
      companion_file_name
    );

    let relevantHistory = "";
    if (!!similarDocs && similarDocs.length !== 0) {
      relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
    }

    const { handlers } = LangChainStream();

    // OpenAI API call
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
          ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 

          ${companion.instructions}

          Below are relevant details about ${companion.name}'s past and the conversation you are in.
          ${relevantHistory}
          `,
        },
        {
          role: "user",
          content: `${recentChatHistory}\n${companion.name}:`,
        },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    const choices = response.data.choices;
    if (!choices || choices.length === 0 || !choices[0].message || !choices[0].message.content) {
      throw new Error("No valid response from OpenAI");
    }

    const resp = choices[0].message.content;
    const cleaned = resp.replaceAll(",", "");
    const chunks = cleaned.split("\n");
    const reply = chunks[0];

    await memoryManager.writeToHistory("" + reply.trim(), companionKey);
    var Readable = require("stream").Readable;

    let s = new Readable();
    s.push(reply);
    s.push(null);
    if (reply !== undefined && reply.length > 1) {
      memoryManager.writeToHistory("" + reply.trim(), companionKey);

      await prismadb.companion.update({
        where: {
          id: params.chatId,
        },
        data: {
          messages: {
            create: {
              content: reply.trim(),
              role: "system",
              userId: user?.id!,
            },
          },
        },
      });
    }

    return new StreamingTextResponse(s);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

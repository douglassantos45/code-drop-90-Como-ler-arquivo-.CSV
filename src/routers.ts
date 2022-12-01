import { Request, Response, Router } from "express";
import { Readable } from "stream";
import readline from "readline";
import multer from "multer";
import { client } from "./database/client";

const multerConfig = multer();

const router = Router();

interface IProducts {
  code_bar: string;
  description: string;
  price: number;
  quantity: number;
}

router.post(
  "/products",
  multerConfig.single("file"),
  async (req: Request, res: Response) => {
    const { file } = req;
    const buffer = file?.buffer;

    const readableFile = new Readable();
    readableFile.push(buffer);
    readableFile.push(null);

    const productsLine = readline.createInterface({
      input: readableFile,
    });

    const products: IProducts[] = [];

    for await (let line of productsLine) {
      const productArray = line.split(",");

      products.push({
        code_bar: productArray[0],
        description: productArray[1],
        price: Number(productArray[2]),
        quantity: Number(productArray[3]),
      });
    }

    for await (let { code_bar, description, price, quantity } of products) {
      await client.products.create({
        data: {
          code_bar,
          description,
          price,
          quantity,
        },
      });
    }

    return res.json(products);
  }
);

export { router };

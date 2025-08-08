import z from "zod"
import { addProduct, editQuantity, getOrderDetails, removeProduct,  } from "./ae.tool.js"

// Example tool implementations
function addTwoNumbers({ a, b }) {
    return {
        content: [
            {
                type: "text",
                text: `The sum of ${a} and ${b} is ${a + b}`
            }
        ]
    };
}

// Export a function to register all tools
export function registerTools(server) {
    // add numbers
    server.tool(
        "addTwoNumbers",
        "Add two numbers",
        {
            a: z.number(),
            b: z.number()
        },
        async (arg) => addTwoNumbers(arg)
    );

    // // get products
    // server.tool(
    //     "get_products_ae",
    //     "Get all the products from within the shop",
    //     {
    //         query: z.string(),
    //         context: z.string().optional(),
    //     },
    //     async (arg) => getProducts(arg.query)
    // );

    // order details
    server.tool(
        "get_order_details_ae",
        "Get all the order details of the product",
        {
            query: z.string(),
            orderId: z.string(),
            context: z.string().optional(),
        },
        async (arg) => {
            const {query, context, orderId} = arg;
            const data = await getOrderDetails(query, context, orderId)
            // return getOrderDetails(query, context, orderId);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2)
                    }
                ]
            };
        }
    );

    // add product
    server.tool(
        "add_product_ae",
        "Add products in the order that is already placed.",
        {
            query: z.string().optional(), 
            context: z.string().optional(), 
            orderId: z.string(), 
            customerId: z.string(), 
            productVariantId: z.string(), 
            quantity: z.number()
        },
        async (arg) => {
            const {query, context, orderId, customerId, productVariantId, quantity} = arg;
            // console.log("-------------------------hit", query, context, orderId, customerId, productVariantId, quantity)
            const data = await addProduct(query, context, orderId, customerId, productVariantId, quantity)
            console.log(data);
            
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2)
                    }
                ]
            };
        }
    )
    
    // remove product
    server.tool(
        "remove_product_ae",
        "Remove products in the order that is already placed.",
        {
            query: z.string().optional(), 
            context: z.string().optional(), 
            orderId: z.string(), 
            customerId: z.string(), 
            productVariantId: z.string(), 
            calculatedLineItemId: z.string()
        },
        async (arg) => {
            const {query, context, orderId, customerId, productVariantId, calculatedLineItemId} = arg;
            // console.log("-------------------------hit", query, context, orderId, customerId, productVariantId, calculatedLineItemId)
            const data = await removeProduct(query, context, orderId, customerId, productVariantId, calculatedLineItemId)
            console.log(data);
            
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2)
                    }
                ]
            };
        }
    )

    // edit quantity
    server.tool(
        "edit_quantity_ae",
        "Remove products in the order that is already placed.",
        {
            query: z.string().optional(), 
            context: z.string().optional(),
            orderId: z.string(),     
            calculatedLineItemId: z.string(),
            quantity: z.number(),
            oldQuantity: z.number(),
            customerId: z.string(),
            productVariantId: z.string()
        },
        async (arg) => {
            const {query, context, orderId, customerId, productVariantId, calculatedLineItemId, quantity, oldQuantity} = arg;
            // console.log("-------------------------hit", query, context, orderId, customerId, productVariantId, calculatedLineItemId)
            const data = await editQuantity(query, context, orderId, customerId, productVariantId, calculatedLineItemId, quantity, oldQuantity)
            console.log(data);
            
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2)
                    }
                ]
            };
        }
    )

    // Add more tools as needed...
}

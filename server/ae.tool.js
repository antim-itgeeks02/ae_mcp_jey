import axios from "axios"

const staticApiKey = "ae_aca4b3757c735ef5402a94994c9ef999dab7ad212018aebebce7b7ca88719dbb"
const shop = "shop-chat-agent-674.myshopify.com"
const lang = "en"
const extension = "IndividualEditOrderItems"


export async function getOrderDetails(query, context, orderId) {
    try {
        // console.log("hit", orderId, "q",query, context);
        const response = await axios.get(`https://account-editor-stage.fly.dev/api/extension/order/details?orderId=${orderId}&extensionName=${extension}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,{
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function addProduct(query, context, orderId, customerId, productVariantId, quantity) {
    try {
        // console.log("hit", orderId, "q",query, context);
        const data = [
            {
                productVariantId,
                quantity,
                customerId,
                selectedMethod: null
            }
        ];
        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/edit/add-item?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function removeProduct(query, context, orderId, customerId, productVariantId, calculatedLineItemId) {
    try {
        // console.log("hit", orderId, "q",query, context);
        const data = {
            calculatedLineItemId,
            customerId,
            productVariantId,
            selectedMethod: null
          }
        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/edit/remove-item?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

export async function editQuantity(query, context, orderId, customerId, productVariantId, calculatedLineItemId, quantity, oldQuantity) {
    try {
        // console.log("hit", orderId, "q",query, context);
        const data = [{
            calculatedLineItemId,
            quantity,
            oldQuantity,
            customerId,
            productVariantId,
            selectedMethod: null
          }]
          
        const response = await axios.post(`https://account-editor-stage.fly.dev/api/extension/edit/edit-item?orderId=${orderId}&language=${lang}&shop=${shop}&apiKey=${staticApiKey}`,
            data,
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data
    } catch (error) {
        console.log(error)
        return error
    }
}

// getOrderDetails("6070613082181")
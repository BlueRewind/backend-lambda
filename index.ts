import { APIGatewayProxyEventPathParameters, APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { DatabaseHelper } from './db';
import { Output, ValidatedRequest, ValidationResponse } from "./types";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    const { password, isValid }: ValidatedRequest = validateAndParseRequest(event.pathParameters);

    if (!isValid) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Password cannot be empty" })
        };
    }
    console.log(`Received password: ${password}`);

    const dbHelper = new DatabaseHelper();

    await dbHelper.initialize();
    const success: boolean = await dbHelper.insertPassword(password);
    await dbHelper.close();

    const response: Output = {
        site: "test_site",
        breached_password: password,
        password_strength: 10,
        first_seen: new Date()
    };

    return {
        statusCode: 200,
        body: JSON.stringify({
          message: success ? 'Password inserted successfully' : 'Failed to insert password',
          data: success ? response : null,
        }),
      };
};

const validateAndParseRequest = (pathParameters: APIGatewayProxyEventPathParameters | undefined): ValidationResponse => {
    const password = pathParameters?.password ?? "";
    const isValid = password.length > 0;

    if (!isValid) {
        console.warn("Validation failed: Password is empty.");
    } else {
        console.log(`Validated password: ${password}`);
    }

    return { password: password, isValid };
};

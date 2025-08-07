import { chromium as playwright } from "playwright-core";
import chromium from "@sparticuz/chromium";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ensureDirectoriesExist } from "./utils";
import {
  BROWSER_ARGS,
  VIEWPORT,
  USER_AGENT,
  TIMEOUT_NAVIGATION,
  TIMEOUT_SELECTOR,
  PARAMETERS,
} from "./utils/constants";
import { TestResult, TestStep, FormValidationResult } from "./utils/types";
import { validateAllFormElements, allValidationsPassed, getFailedValidations, calculateTotalValidationTime } from "./utils/form-validator";

/**
 * AWS Lambda handler function for automated web screenshot capture and S3 storage.
 *
 * This function automates the process of taking screenshots of specific web elements
 * using Playwright in a serverless AWS Lambda environment. It navigates to the Aegean Air
 * flights booking page, captures a screenshot of the flight booking component, and uploads
 * it to an S3 bucket for storage and retrieval.
 *
 * @description
 * The handler performs the following operations:
 * 1. Initializes a headless Chromium browser instance optimized for Lambda
 * 2. Navigates to the target URL (Aegean Air flights page)
 * 3. Waits for the specific flight booking component to load
 * 4. Captures a screenshot of the target element
 * 5. Uploads the screenshot to AWS S3 with a timestamped filename
 * 6. Returns the S3 URL and operation status
 *
 * @param {APIGatewayProxyEvent} event - The API Gateway event object containing:
 *   - httpMethod: The HTTP method used for the request
 *   - headers: Request headers including authorization and content-type
 *   - queryStringParameters: URL query parameters (optional)
 *   - body: Request body content (optional)
 *   - pathParameters: Path parameters from the URL (optional)
 *   - requestContext: Additional request context from API Gateway
 *
 * @param {Context} [context] - Optional AWS Lambda context object containing:
 *   - functionName: Name of the Lambda function
 *   - functionVersion: Version of the Lambda function
 *   - invokedFunctionArn: ARN of the invoked function
 *   - memoryLimitInMB: Memory limit configured for the function
 *   - remainingTimeInMillis: Remaining execution time
 *   - logGroupName: CloudWatch log group name
 *   - logStreamName: CloudWatch log stream name
 *   - awsRequestId: Unique request identifier
 *
 * @returns {Promise<APIGatewayProxyResult>} A promise that resolves to an API Gateway response object containing:
 *   - statusCode: HTTP status code (200 for success, 500 for errors)
 *   - headers: Response headers including Content-Type
 *   - body: JSON stringified response body with:
 *     - message: Success or error message
 *     - timestamp: ISO timestamp of the operation
 *     - screenshotUrl: S3 URL of the captured screenshot (on success)
 *     - event: Original event object for debugging
 *
 * @throws {Error} Throws various errors that are caught and returned as 500 responses:
 *   - Browser launch failures due to Lambda environment constraints
 *   - Navigation timeouts when the target page fails to load
 *   - Element not found errors when the flight booking component is missing
 *   - File system errors during screenshot saving
 *   - S3 upload failures due to permissions or network issues
 *
 * @example
 * // Example successful response
 * {
 *   statusCode: 200,
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     message: "Success",
 *     timestamp: "2024-01-15T10:30:45.123Z",
 *     screenshotUrl: "https://technical-playwright-result.s3.amazonaws.com/screenshots/aegean-flight-booking-2024-01-15T10-30-45-123Z.png",
 *     event: { ... }
 *   })
 * }
 *
 * @example
 * // Example error response
 * {
 *   statusCode: 500,
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     message: "Error: Flight booking component not found",
 *     timestamp: "2024-01-15T10:30:45.123Z",
 *     screenshotUrl: null,
 *     event: { ... }
 *   })
 * }
 *
 * @requires playwright-core - For browser automation
 * @requires @sparticuz/chromium - Chromium binary optimized for Lambda
 * @requires @aws-sdk/client-s3 - AWS S3 client for file uploads
 *
 * @environment
 * Required environment variables:
 * - AWS_REGION: AWS region for S3 operations (defaults to 'us-east-2')
 * - AWS_S3_BUCKET: S3 bucket name for screenshot storage (defaults to 'technical-playwright-result')
 *
 * @performance
 * - Average execution time: 15-30 seconds (depending on page load time)
 * - Memory usage: ~512MB recommended minimum
 * - Timeout: Configure Lambda timeout to at least 60 seconds
 *
 * @security
 * - Requires appropriate IAM permissions for S3 PutObject operations
 * - Screenshots are stored with public read access via S3 URLs
 * - No sensitive data should be captured in screenshots
 *
 * @version 1.0.0
 * @since 2025-07-24
 * @author a11ySolutions Development Team
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context?: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = performance.now();
  let browser: any = null;
  let screenshotUrl: string | null = null;
  let statusCode = 200;
  let message = "Success";
  
  // Initialize test results
  const testSteps: TestStep[] = [];
  const errors: string[] = [];
  let validations: FormValidationResult[] = [];

  try {
    // Step 1: Ensure necessary directories exist
    const step1Start = performance.now();
    await ensureDirectoriesExist();
    testSteps.push({
      step: "Ensure directories exist",
      success: true,
      executionTime: performance.now() - step1Start,
      details: "Directories created successfully"
    });

    // Step 2: Launch browser
    const step2Start = performance.now();
    browser = await playwright.launch({
      args: BROWSER_ARGS,
      executablePath: await chromium.executablePath(),
    });
    testSteps.push({
      step: "Launch browser",
      success: true,
      executionTime: performance.now() - step2Start,
      details: "Browser launched successfully"
    });

    const context = await browser.newContext({
      viewport: VIEWPORT,
      userAgent: USER_AGENT,
    });

    const page = await context.newPage();
    page.setDefaultNavigationTimeout(TIMEOUT_NAVIGATION);

    // Step 3: Navigate to Aegean Air page
    const step3Start = performance.now();
    await page.goto(PARAMETERS.url, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT_NAVIGATION,
    });
    testSteps.push({
      step: "Navigate to Aegean Air page",
      success: true,
      executionTime: performance.now() - step3Start,
      details: `Navigated to ${PARAMETERS.url}`
    });

    // Step 4: Wait for booking component
    const step4Start = performance.now();
    await page.waitForSelector(PARAMETERS.selector, {
      state: "visible",
      timeout: TIMEOUT_SELECTOR,
    });
    testSteps.push({
      step: "Wait for booking component",
      success: true,
      executionTime: performance.now() - step4Start,
      details: `Component ${PARAMETERS.selector} found`
    });

    // Step 5: Validate form elements
    const step5Start = performance.now();
    validations = await validateAllFormElements(page);
    const validationTime = performance.now() - step5Start;
    
    testSteps.push({
      step: "Validate form elements",
      success: allValidationsPassed(validations),
      executionTime: validationTime,
      details: {
        totalElements: validations.length,
        passedElements: validations.filter(v => v.found).length,
        failedElements: getFailedValidations(validations).length
      }
    });

    // Step 6: Capture screenshot
    const step6Start = performance.now();
    const element = await page.$(PARAMETERS.selector);
    if (!element) {
      throw new Error("Flight booking component not found");
    }

    const screenshotPath = "/tmp/screenshots/flight-booking-component.png";
    await element.screenshot({ path: screenshotPath });
    testSteps.push({
      step: "Capture screenshot",
      success: true,
      executionTime: performance.now() - step6Start,
      details: `Screenshot saved to ${screenshotPath}`
    });

    // Step 7: Upload to S3
    const step7Start = performance.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${process.env.PREFIX || ""}-aegean-flight-booking-${timestamp}.png`;

    // Verify file exists
    try {
      await fs.access(screenshotPath);
    } catch (error: any) {
      throw new Error(`Screenshot file not found at ${screenshotPath}`);
    }

    // Initialize S3 client and upload
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-2",
    });
    const bucketName = process.env.AWS_S3_BUCKET || "technical-playwright-result";

    const fileContent = await fs.readFile(screenshotPath);
    const params = {
      Bucket: bucketName,
      Key: `screenshots/${filename}`,
      Body: fileContent,
      ContentType: "image/png",
    };

    const uploadCommand = new PutObjectCommand(params);
    await s3Client.send(uploadCommand);

    screenshotUrl = `https://${bucketName}.s3.amazonaws.com/screenshots/${filename}`;
    testSteps.push({
      step: "Upload to S3",
      success: true,
      executionTime: performance.now() - step7Start,
      details: `Uploaded to ${screenshotUrl}`
    });

  } catch (error: any) {
    console.error("Error:", error);
    console.error("Stack trace:", error.stack);
    statusCode = 500;
    message = `Error: ${error.message}`;
    errors.push(error.message);
    
    // Add failed step
    testSteps.push({
      step: "Error occurred",
      success: false,
      executionTime: 0,
      error: error.message
    });
  } finally {
    // Close browser if it was opened
    if (browser) {
      try {
        await browser.close();
      } catch (closeError: any) {
        console.error("Error closing browser:", closeError);
      }
    }
  }

  // Calculate total execution time
  const totalExecutionTime = performance.now() - startTime;

  // Create comprehensive test result
  const testResult: TestResult = {
    success: statusCode === 200 && errors.length === 0,
    timestamp: new Date().toISOString(),
    totalExecutionTime,
    validations: validations || [], // Add validations if they exist
    steps: testSteps,
    screenshotUrl: screenshotUrl || undefined,
    errors,
    message
  };

  // Create response
  const response: APIGatewayProxyResult = {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testResult),
  };
  
  return response;
};

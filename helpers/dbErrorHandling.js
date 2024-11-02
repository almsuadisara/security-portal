"use strict";

/**
 * Get unique error field name
 */
const uniqueMessage = error => {
    let output;
    try {
        const fieldNameMatch = error.message.match(/index: (.+?) dup key/);
        let fieldName = fieldNameMatch ? fieldNameMatch[1].split('_')[0] : null;

        if (fieldName) {
            output = `An account with this ${fieldName} already exists.`;
        } else {
            output = "An account with this field already exists.";
        }
    } catch (ex) {
        output = "An account with this field already exists.";
    }

    return output;
};

/**
 * Get the error message from error object and include details for debugging
 */
exports.errorHandler = error => {
    let message = "";

    // عرض الخطأ بالكامل في الاستجابة لسهولة التحقق
    let errorDetails = {
        message: "An unexpected error occurred.",
        errorInfo: error // تضمين تفاصيل الخطأ كاملة في Postman
    };

    if (error.code) {
        switch (error.code) {
            case 11000:
            case 11001:
                message = uniqueMessage(error);
                break;
            default:
                message = "An unexpected error occurred.";
        }
        errorDetails.message = message;
    } else if (error.errors) {
        for (let errorName in error.errors) {
            if (error.errors[errorName].message) {
                message = error.errors[errorName].message;
                break;
            }
        }
        errorDetails.message = message;
    } else if (error.message) {
        errorDetails.message = error.message;
    }

    return errorDetails;
};

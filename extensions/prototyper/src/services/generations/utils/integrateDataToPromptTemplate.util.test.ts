import integrateDataToPromptTemplate from './integrateDataToPromptTemplate.util';

console.log('=== Testing integrateDataToPromptTemplate ===');

// Test 1: Basic functionality
console.log('\n--- Test 1: Basic template processing ---');
const basicTemplate = {
    system: ["You are ${role}", "Process: ${data}"],
    model: "test-model",
    temperature: 0.5
};

const basicData = {
    role: "a helpful assistant",
    data: "user input",
    model: "anthropic.claude-sonnet-3-5" // Should override template model
};

try {
    const result1 = integrateDataToPromptTemplate(basicTemplate, basicData);
    console.log('✅ Basic test successful');
    console.log('System:', result1.system);
    console.log('Model override worked:', result1.model === basicData.model);
} catch (error) {
    console.error('❌ Basic test failed:', error);
}

// Test 2: Recursive placeholder replacement in complex objects
console.log('\n--- Test 2: Recursive placeholder replacement ---');
const recursiveTemplate = {
    system: [
        "You are a test assistant",
        "User info: ${user_profile}",
        "Settings: ${app_config}"
    ]
};

const recursiveData = {
    username: "john_doe",
    user_profile: {
        name: "User ${username}",
        preferences: {
            theme: "dark",
            greeting: "Hello ${username}!"
        }
    },
    app_config: {
        title: "App for ${username}",
        features: ["feature1", "feature2"]
    }
};

try {
    const result2 = integrateDataToPromptTemplate(recursiveTemplate, recursiveData);
    console.log('✅ Recursive test successful');
    console.log('Result:', JSON.stringify(result2, null, 2));
    
    // Check if recursive replacement worked
    const systemStr = result2.system;
    const hasReplacedUsername = systemStr.includes('User john_doe') && systemStr.includes('Hello john_doe!');
    console.log('Recursive replacement worked:', hasReplacedUsername);
    
} catch (error) {
    console.error('❌ Recursive test failed:', error);
}

// Test 3: Complex object handling with arrays
console.log('\n--- Test 3: Arrays and complex structures ---');
const complexTemplate = {
    system: "Process these samples: ${samples}",
    message: "Use examples: ${example_list}"
};

const complexData = {
    product_name: "Widget A",
    samples: {
        data: [
            { id: 1, name: "Sample for ${product_name}" },
            { id: 2, name: "Another ${product_name} sample" }
        ],
        metadata: {
            count: 2,
            description: "Samples for ${product_name}"
        }
    },
    example_list: ["Example 1 for ${product_name}", "Example 2"]
};

try {
    const result3 = integrateDataToPromptTemplate(complexTemplate, complexData);
    console.log('✅ Complex structures test successful');
    console.log('System contains replaced product names:', result3.system.includes('Widget A'));
    console.log('Message contains replaced examples:', result3.message.includes('Widget A'));
} catch (error) {
    console.error('❌ Complex structures test failed:', error);
}

// Test 4: Prev array processing (conversation history)
console.log('\n--- Test 4: Prev array processing ---');
const conversationTemplate = {
    system: ["You are ${agent_role}", "Current session: ${session_id}"],
    prev: [
        {
            role: 'user',
            content: 'Hello, I am ${user_name} and I need help with ${task_type}'
        },
        {
            role: 'agent',
            content: 'Hi ${user_name}! I can help you with ${task_type}. Let me assist you with ${specific_help}.'
        },
        {
            role: 'user',
            content: 'My project is called ${project_name} and uses ${technology}'
        }
    ],
    message: "Continue the conversation for ${user_name}"
};

const conversationData = {
    agent_role: "a helpful coding assistant",
    session_id: "session_123",
    user_name: "Alice",
    task_type: "JavaScript debugging",
    specific_help: "finding the bug",
    project_name: "MyApp",
    technology: "React"
};

console.log('📋 Original Template:');
console.log(JSON.stringify(conversationTemplate, null, 2));
console.log('\n📊 Injection Data:');
console.log(JSON.stringify(conversationData, null, 2));

try {
    const result4 = integrateDataToPromptTemplate(conversationTemplate, conversationData);
    console.log('\n✅ Prev array processing successful');
    console.log('🎯 Final Result:');
    console.log(JSON.stringify(result4, null, 2));
    
    // Check if prev array was processed correctly
    const prevContent = JSON.stringify(result4.prev);
    const hasUserName = prevContent.includes('Alice');
    const hasTaskType = prevContent.includes('JavaScript debugging');
    const hasProjectName = prevContent.includes('MyApp');
    
    console.log('\n📈 Validation Results:');
    console.log('Prev array contains user name:', hasUserName);
    console.log('Prev array contains task type:', hasTaskType);
    console.log('Prev array contains project name:', hasProjectName);
    console.log('Message processed:', result4.message.includes('Alice'));
    
} catch (error) {
    console.error('❌ Prev array processing failed:', error);
}

// Test 5: Array format support for message and prev content
console.log('\n--- Test 5: Array format support for message and prev content ---');
const arrayFormatTemplate = {
    system: ["You are ${role}"],
    message: [
        "Please help ${user_name} with the following:",
        "Task: ${task_description}",
        "Requirements: ${requirements}",
        "Expected output: ${expected_format}"
    ],
    prev: [
        {
            role: 'user',
            content: [
                "Hi, I'm ${user_name}",
                "I need help with ${primary_task}",
                "My background: ${user_background}"
            ]
        },
        {
            role: 'agent',
            content: [
                "Hello ${user_name}!",
                "I understand you need help with ${primary_task}",
                "Given your ${user_background} background, I recommend ${recommendation}"
            ]
        }
    ]
};

const arrayFormatData = {
    role: "an expert consultant",
    user_name: "Bob",
    task_description: "API integration",
    requirements: "RESTful endpoints",
    expected_format: "JSON responses",
    primary_task: "connecting to third-party services",
    user_background: "frontend development",
    recommendation: "using axios library"
};

console.log('📋 Original Template (with arrays):');
console.log(JSON.stringify(arrayFormatTemplate, null, 2));
console.log('\n📊 Injection Data:');
console.log(JSON.stringify(arrayFormatData, null, 2));

try {
    const result5 = integrateDataToPromptTemplate(arrayFormatTemplate, arrayFormatData);
    console.log('\n✅ Array format processing successful');
    console.log('🎯 Final Result:');
    console.log(JSON.stringify(result5, null, 2));
    
    // Validate array-to-string conversion and placeholder replacement
    console.log('\n📈 Validation Results:');
    console.log('Message is string (joined from array):', typeof result5.message === 'string');
    console.log('Message contains user name:', result5.message.includes('Bob'));
    console.log('Prev[0] content is string:', typeof result5.prev[0].content === 'string');
    console.log('Prev[0] content contains user name:', result5.prev[0].content.includes('Bob'));
    console.log('Prev[1] content contains recommendation:', result5.prev[1].content.includes('axios library'));
    
} catch (error) {
    console.error('❌ Array format processing failed:', error);
}

export {};
const Groq = require("groq-sdk");
require("dotenv").config();

async function testGroq() {
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const contract = `
pragma solidity ^0.8.0;

contract Vulnerable {
    mapping(address => uint256) public balances;

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] = 0;
    }
}
  `;

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
    messages: [
  {
    role: "system",
    content: `
You are a senior smart contract security auditor.

Your task is to perform a deep security audit of Solidity smart contracts.

Return ONLY valid JSON (no markdown, no explanation).

Each vulnerability must follow this structure:
[
  {
    "type": "string",
    "severity": "critical | high | medium | low",
    "description": "clear explanation of the issue",
    "impact": "what attacker can do",
    "fix": "how to fix it",
    "confidence": "high | medium | low"
  }
]

Strict rules:
- No extra text outside JSON
- No comments
- No explanations
- Be precise and technical
- If no issues, return []
`
  },
  {
    role: "user",
    content: `
Analyze the following Solidity smart contract for vulnerabilities.

Focus on:
- Reentrancy
- Integer overflow/underflow
- Access control issues
- Logic bugs
- Denial of Service (DoS)
- Unsafe external calls
- State inconsistency
- Missing validations

Contract:
${contract}
`
  }
],
      max_tokens: 10000,
    });

    console.log("\n=== RESPONSE ===\n");
    console.log(response.choices[0]?.message?.content);
  } catch (err) {
    console.error("Error:", err);
  }
}

testGroq();
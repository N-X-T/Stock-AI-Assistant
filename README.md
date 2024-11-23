## Installation

There are mainly 2 ways of installing With Docker, Without Docker. Using Docker is highly recommended.

### Getting Started with Docker (Recommended)

1. Ensure Docker is installed and running on your system.
2. Clone the repository:
3. After cloning, navigate to the directory containing the project files.

4. Rename the `.env.example` file to `.env` in root folder. For Docker setups, you need only fill in the following fields:

   - `OPENAI`: Your OpenAI API key. **You only need to fill this if you wish to use OpenAI's models**.
   - `GROQ`: Your Groq API key. **You only need to fill this if you wish to use Groq's hosted models**.(Optional)
   - `ANTHROPIC`: Your Anthropic API key. **You only need to fill this if you wish to use Anthropic models**.(Optional)
   - `SIMILARITY_MEASURE`: The similarity measure to use (This is filled by default; you can leave it as is if you are unsure about it.)

5. Ensure you are in the directory containing the `docker-compose.yaml` file and execute:

   ```bash
   docker compose up -d
   ```

6. Wait a few minutes for the setup to complete. You can access Perplexica at http://localhost:3000 in your web browser.

**Note**: After the containers are built, you can start Perplexica directly from Docker without having to open a terminal.

### Non-Docker Installation

1. Clone the repository and rename the `.env.example` file to `.env` in the root directory. Ensure you complete all required fields in this file.
2. Rename the `.env.example` file to `.env` in the `ui` folder and fill in all necessary fields.
3. After populating the configuration and environment files, run `npm i` in both the `ui` folder and the root directory.
4. Install the dependencies and then execute `npm run build` in both the `ui` folder and the root directory.
5. Finally, start both the frontend and the backend by running `npm run start` in both the `ui` folder and the root directory.
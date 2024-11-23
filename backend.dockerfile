FROM node:slim

WORKDIR /home/stock

# Install dependencies for node-gyp and better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY src /home/stock/src
COPY tsconfig.json /home/stock/
COPY drizzle.config.ts /home/stock/
COPY package.json /home/stock/
COPY yarn.lock /home/stock/

RUN mkdir /home/stock/data

RUN yarn install --frozen-lockfile
RUN yarn build

CMD ["yarn", "start"]
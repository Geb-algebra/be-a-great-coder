# Fly Setup

1. [Install `flyctl`](https://fly.io/docs/getting-started/installing-flyctl/)

2. Sign up and log in to Fly

```sh
flyctl auth signup
```

3. Overwrite app name and region to deploy as you like

```
# fly.toml
app = "your-app-name"
primary_region = "region-you-like
```

A complete list of region is [here](https://fly.io/docs/reference/regions/#fly-io-regions)

4. Create a new APP on Fly.

```sh
flyctl launch
```

5. Register SESSION_SECRET as an secret

```
fly secrets set SESSION_SECRET=your-value
```

6. Deploy.

```sh
npm run deploy
```

it automatically creates all infrastructures you need, including a machine with shared-cpu-1x, 1GB persistent volume, shared IPv4 address, dedicated IPv6 address and a domain name for accessing the app.

You can run `flyctl info` to get the url and ip address of your server.

Check out the [fly docs](https://fly.io/docs/getting-started/node/) for more information.

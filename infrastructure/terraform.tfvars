region = "us-east-1"
vpc_name = "ecommerce-vpc"
vpc_cidr = "10.0.0.0/16"

subnets = [
  {
    name              = "subnet-1"
    cidr_block        = "10.0.1.0/24"
    availability_zone = "us-east-1a"
  },
  {
    name              = "subnet-2"
    cidr_block        = "10.0.2.0/24"
    availability_zone = "us-east-1b"
  },
  {
    name              = "subnet-3"
    cidr_block        = "10.0.3.0/24"
    availability_zone = "us-east-1c"
  }
]

cluster_name   = "ecommerce-cluster"
node_group_name = "ecommerce-node-group"

instance_types = ["t3.medium"]
capacity_type  = "ON_DEMAND"

desired_size = 2
min_size     = 1
max_size     = 3

disk_size = 30

repositories = [
  "frontend",
  "gateway",
  "auth",
  "products",
  "orders",
  "users"
]
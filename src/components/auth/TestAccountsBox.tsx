import { User, Shield, Store } from "lucide-react";

interface TestAccount {
  label: string;
  email: string;
  password: string;
  icon: React.ReactNode;
  role: string;
}

const testAccounts: TestAccount[] = [
  {
    label: "Admin",
    email: "bicollectiveadmin@gmail.com",
    password: "bicollectiveadmin",
    icon: <Shield className="w-4 h-4" />,
    role: "Platform Owner",
  },
  {
    label: "Vendor",
    email: "bicollectivevendor@gmail.com",
    password: "bicollectivevendor",
    icon: <Store className="w-4 h-4" />,
    role: "Seller Account",
  },
  {
    label: "Customer",
    email: "bicollectivecustomer@gmail.com",
    password: "bicollectivecustomer",
    icon: <User className="w-4 h-4" />,
    role: "Buyer Account",
  },
];

interface TestAccountsBoxProps {
  onSelectAccount: (email: string, password: string) => void;
}

const TestAccountsBox = ({ onSelectAccount }: TestAccountsBoxProps) => {
  return (
    <div className="card-brutal p-4 bg-secondary/50">
      <h3 className="font-heading text-xs uppercase tracking-wide mb-3 text-muted-foreground">
        Test Accounts
      </h3>
      <div className="space-y-2">
        {testAccounts.map((account) => (
          <button
            key={account.email}
            onClick={() => onSelectAccount(account.email, account.password)}
            className="w-full flex items-center gap-3 p-2 hover:bg-background rounded transition-colors text-left group"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-background border border-border-subtle group-hover:border-foreground transition-colors">
              {account.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-heading text-sm uppercase tracking-wide">
                {account.label}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {account.role}
              </div>
            </div>
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Use
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TestAccountsBox;

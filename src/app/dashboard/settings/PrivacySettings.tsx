"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DownloadIcon, TrashIcon, ExternalLinkIcon } from "@radix-ui/react-icons";

interface PrivacySettingsProps {
  profile: any;
}

export default function PrivacySettings({ profile }: PrivacySettingsProps) {
  const supabase = createClientComponentClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { user_id: profile.id }
      });

      if (error) {
        throw error;
      }

      if (data?.download_url) {
        // Open download URL in new tab
        window.open(data.download_url, '_blank');
        toast.success("Data export started. Download will begin shortly.");
      } else {
        toast.success("Data export requested. You'll receive an email with download link.");
      }
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const { error } = await supabase.functions.invoke('delete-user-data', {
        body: { user_id: profile.id }
      });

      if (error) {
        throw error;
      }

      // Sign out user
      await supabase.auth.signOut();
      
      toast.success("Account deleted successfully");
      window.location.href = "/";
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacy Information</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your privacy is important to us. Here's what data we collect and how you can manage it.
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data We Collect</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>• Profile information (name, email, preferences)</div>
            <div>• Biometric data (weight, height, body fat percentage)</div>
            <div>• Nutrition goals and activity level</div>
            <div>• Food diary entries and consumption data</div>
            <div>• Usage analytics (anonymized)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>• Active account data is retained indefinitely</div>
            <div>• Deleted account data is purged within 30 days</div>
            <div>• Analytics data is anonymized after 90 days</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Your Rights</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You have the right to access, export, and delete your personal data.
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DownloadIcon className="h-4 w-4" />
                Export Your Data
              </CardTitle>
              <CardDescription>
                Download a copy of all your personal data in JSON format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleExportData} 
                disabled={isExporting}
                variant="outline"
              >
                {isExporting ? "Preparing Export..." : "Export Data"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <TrashIcon className="h-4 w-4" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers, including:
                      <br /><br />
                      • Your profile and preferences
                      <br />
                      • All biometric data and measurements
                      <br />
                      • Food diary entries and history
                      <br />
                      • Goals and targets
                      <br /><br />
                      You will be immediately signed out and will not be able to recover this data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Privacy Policy</span>
          <ExternalLinkIcon className="h-3 w-3" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: {profile?.accepted_privacy_at ? 
            new Date(profile.accepted_privacy_at).toLocaleDateString() : 
            "Not available"
          }
        </p>
      </div>
    </div>
  );
}
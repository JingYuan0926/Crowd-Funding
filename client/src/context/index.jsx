import React, { useContext, createContext } from "react";
import { useAddress, useContract, useContractWrite, useMetamask, useContractRead } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const { contract } = useContract("0xd2e14bb75304F967656febE097f4E91D9d21a653");

    const { mutateAsync: createCampaign } = useContractWrite(contract, "createCampaign")

    const address = useAddress();
    const connect = useMetamask();

    const publishCampaign = async (form) => {
        try {
            // Need to write the word args
            // Follow the documentation everytime
            const data = await createCampaign({
                args: [
                    address,
                    form.title,
                    form.description,
                    form.target,
                    new Date(form.deadline).getTime(),
                    form.image]
            });
            console.log("contract call success", data);
        }
        catch (error) {
            console.log("contract call fail", error);
        }
    }

    const getCampaigns = async () => {
        try {
            const campaigns = await contract.call("getCampaigns")
            const parsedCampaigns = campaigns.map((campaign, i) => ({
                owner: campaign.owner,
                title: campaign.title,
                description: campaign.description,
                target: ethers.utils.formatEther(campaign.target.toString()),
                deadline: campaign.deadline.toNumber(),
                amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
                image: campaign.image,
                pId: i
            }));

            return parsedCampaigns;
        } catch (error) {
            console.log(error)
        }
    }

    const getUserCampaigns = async () => {
        const allCampaigns = await getCampaigns();

        const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

        return filteredCampaigns;
    }

    // add [] at the arguments
    const donate = async (pId, amount) => {
        const data = await contract.call("donateToCampaign", [pId], { value: ethers.utils.parseEther(amount) });
        return data;
    }

    // same here
    const getDonations = async (pId) => {
        const donations = await contract.call("getDonators", [pId]);
        const numberOfDonations = donations[0].length;
        const parsedDonations = [];
        for (let i = 0; i < numberOfDonations; i++) {
            parsedDonations.push({
                donator: donations[0][i],
                amount: ethers.utils.formatEther(donations[1][i].toString())
            });
        }
        return parsedDonations;
    }

    return (
        <StateContext.Provider value={{ address, connect, contract, createCampaign: publishCampaign, getCampaigns, getUserCampaigns, donate, getDonations }}>
            {children}
        </StateContext.Provider>
    );
}

export const useStateContext = () => useContext(StateContext);